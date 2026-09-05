import { useEffect, useState } from "react";
import {
  collection,
  query,
  orderBy,
  limit,
  onSnapshot,
} from "firebase/firestore";
import { db } from "../firebaseConfig";

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function getWeekRange() {
  const now = new Date();
  const day = now.getDay();
  const diffToMonday = (day + 6) % 7;
  const monday = new Date(now);
  monday.setDate(now.getDate() - diffToMonday);
  monday.setHours(0, 0, 0, 0);

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);

  return { monday, sunday };
}

export function useAdminAnalytics(isAdmin) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isAdmin) {
      setStats(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    const hoje = startOfToday();
    const { monday, sunday } = getWeekRange();

    const planosRef = collection(db, "planos");
    const qPlanos = query(planosRef, orderBy("updatedAt", "desc"));

    const unsubPlanos = onSnapshot(
      qPlanos,
      (snap) => {
        const docs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

        const usuariosSet = new Set();
        let planosHoje = 0;
        let somaCalorias = 0;
        let countCalorias = 0;

        const gruposCount = {};
        const objetivoCount = {};

        docs.forEach((doc) => {
          if (doc.ownerUid) usuariosSet.add(doc.ownerUid);

          if (doc.updatedAt?.toDate) {
            const updated = doc.updatedAt.toDate();
            if (updated >= hoje) planosHoje++;
          }

          if (doc.nutrition?.total) {
            somaCalorias += Number(doc.nutrition.total);
            countCalorias++;
          }

          const objetivo = doc.plan?.info?.objetivo;
          if (objetivo) {
            objetivoCount[objetivo] = (objetivoCount[objetivo] || 0) + 1;
          }

          const treinos = doc.plan?.treinos;
          if (Array.isArray(treinos)) {
            treinos.forEach((t) => {
              if (!t?.grupo) return;
              const nomeGrupo = t.grupo.toLowerCase();
              gruposCount[nomeGrupo] = (gruposCount[nomeGrupo] || 0) + 1;
            });
          }
        });

        const mediaCalorias =
          countCalorias > 0 ? Math.round(somaCalorias / countCalorias) : null;

        let objetivoPopular = null;
        let objetivoMax = 0;
        Object.entries(objetivoCount).forEach(([obj, cnt]) => {
          if (cnt > objetivoMax) {
            objetivoMax = cnt;
            objetivoPopular = obj;
          }
        });

        const gruposPopulares = Object.entries(gruposCount)
          .map(([grupo, count]) => ({ grupo, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 6);

        const planosRecentes = docs.slice(0, 12);

        setStats((prev) => ({
          ...(prev || {}),
          usuariosAtivos: usuariosSet.size,
          totalPlanos: docs.length,
          planosHoje,
          mediaCalorias,
          objetivoPopular,
          gruposPopulares,
          planosRecentes,
        }));
        setLoading(false);
      },
      (err) => {
        console.error("Erro ao ouvir planos:", err);
        setError("Erro ao carregar métricas de planos.");
        setLoading(false);
      },
    );

    const historicoRef = collection(db, "historicoTreino");
    const qHistorico = query(historicoRef);

    const unsubHistorico = onSnapshot(
      qHistorico,
      async (snap) => {
        let treinosHoje = 0;
        const ranking = [];

        const promises = snap.docs.map(async (userDoc) => {
          const uid = userDoc.id;
          const registrosRef = collection(
            db,
            "historicoTreino",
            uid,
            "registros",
          );
          const qReg = query(registrosRef, orderBy("data", "desc"), limit(200));
          const registrosSnap = await onSnapshotOnce(qReg);

          let totalSemana = 0;

          registrosSnap.forEach((rDoc) => {
            const data = rDoc.data().data?.toDate?.() || null;
            if (!data) return;

            if (data >= hoje) treinosHoje++;

            if (data >= monday && data <= sunday) {
              totalSemana++;
            }
          });

          if (totalSemana > 0) {
            ranking.push({
              uid,
              totalSemana,
              ownerEmail: userDoc.data().ownerEmail || null,
            });
          }
        });

        await Promise.all(promises);

        ranking.sort((a, b) => b.totalSemana - a.totalSemana);

        setStats((prev) => ({
          ...(prev || {}),
          treinosHoje,
          ranking: ranking.slice(0, 10),
        }));
      },
      (err) => {
        console.error("Erro ao ouvir histórico de treinos:", err);
        setError("Erro ao carregar histórico de treinos.");
      },
    );

    return () => {
      unsubPlanos();
      unsubHistorico();
    };
  }, [isAdmin]);

  return { stats, loading, error };
}

function onSnapshotOnce(q) {
  return new Promise((resolve, reject) => {
    const unsub = onSnapshot(
      q,
      (snap) => {
        unsub();
        resolve(snap.docs);
      },
      (err) => {
        unsub();
        reject(err);
      },
    );
  });
}
