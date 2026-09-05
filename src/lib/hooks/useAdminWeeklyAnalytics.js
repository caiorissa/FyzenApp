import { useEffect, useState } from "react";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "../firebaseConfig";

export function useAdminWeeklyAnalytics(isAdmin) {
  const [semanaStats, setSemanaStats] = useState(null);
  const [loadingSemana, setLoadingSemana] = useState(true);
  const [errorSemana, setErrorSemana] = useState(null);

  useEffect(() => {
    if (!isAdmin) {
      setSemanaStats(null);
      setLoadingSemana(false);
      return;
    }

    setLoadingSemana(true);
    setErrorSemana(null);

    const historicoRef = collection(db, "historicoTreino");
    const qHistorico = query(historicoRef);

    const unsub = onSnapshot(
      qHistorico,
      async (snap) => {
        try {
          const agora = new Date();
          const inicioSemana = new Date(agora);
          const day = agora.getDay();
          const diffToMonday = (day + 6) % 7;
          inicioSemana.setDate(agora.getDate() - diffToMonday);
          inicioSemana.setHours(0, 0, 0, 0);

          const dias = {
            segunda: 0,
            terca: 0,
            quarta: 0,
            quinta: 0,
            sexta: 0,
            sabado: 0,
            domingo: 0,
          };

          const promises = snap.docs.map(async (userDoc) => {
            const uid = userDoc.id;
            const registrosRef = collection(
              db,
              "historicoTreino",
              uid,
              "registros",
            );
            const qReg = query(registrosRef, orderBy("data", "desc"));
            const registrosSnap = await new Promise((resolve, reject) => {
              const u = onSnapshot(
                qReg,
                (s) => {
                  u();
                  resolve(s);
                },
                (e) => {
                  u();
                  reject(e);
                },
              );
            });

            registrosSnap.forEach((rDoc) => {
              const data = rDoc.data().data?.toDate?.();
              if (!data || data < inicioSemana) return;

              const d = data.getDay();
              const chave =
                d === 0
                  ? "domingo"
                  : d === 1
                    ? "segunda"
                    : d === 2
                      ? "terca"
                      : d === 3
                        ? "quarta"
                        : d === 4
                          ? "quinta"
                          : d === 5
                            ? "sexta"
                            : "sabado";

              dias[chave] += 1;
            });
          });

          await Promise.all(promises);

          const totalSemana = Object.values(dias).reduce(
            (acc, v) => acc + v,
            0,
          );

          setSemanaStats({
            dias,
            totalSemana,
          });
          setLoadingSemana(false);
        } catch (err) {
          console.error("Erro em useAdminWeeklyAnalytics:", err);
          setErrorSemana(err);
          setLoadingSemana(false);
        }
      },
      (err) => {
        console.error("Erro ao ouvir analyticsSemana:", err);
        setErrorSemana(err);
        setLoadingSemana(false);
      },
    );

    return () => unsub();
  }, [isAdmin]);

  return { semanaStats, loadingSemana, errorSemana };
}
