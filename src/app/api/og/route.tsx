import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";
import { getChallengeById, getRaceDataForChallenge, CHALLENGES } from "@/data/challenges";

export const runtime = "edge";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const challengeId = searchParams.get("c") ?? "";
  const challenge = getChallengeById(challengeId) ?? CHALLENGES[0];
  const raceData = getRaceDataForChallenge(challenge);
  const driver = raceData.drivers.find((d) => d.id === challenge.driverId);
  const driverName = driver?.name ?? "Driver";
  const driverTeamColor = driver?.teamColor ?? "#3671C6";
  const driverNumber = driver?.number ?? 1;
  const raceName = `${raceData.race.name.toUpperCase().replace("GRAND PRIX", "GP")} ${raceData.race.year}`;

  const from = searchParams.get("f") ?? String(challenge.originalPosition);
  const to = searchParams.get("t") ?? String(challenge.originalPosition);
  const score = searchParams.get("s") ?? "0";
  const tier = searchParams.get("tier") ?? "";
  const stStrategy = searchParams.get("st") ?? "";

  const [orbitronData, chakraData] = await Promise.all([
    fetch(
      new URL(
        "https://fonts.gstatic.com/s/orbitron/v35/yMJMMIlzdpvBhQQL_SC3X9yhF25-T1nysimxpg.ttf"
      )
    ).then((res) => res.arrayBuffer()),
    fetch(
      new URL(
        "https://fonts.gstatic.com/s/chakrapetch/v13/cIflMapbsEk7TDLdtEz1BwkeJI9FQA.ttf"
      )
    ).then((res) => res.arrayBuffer()),
  ]);

  const positionsGained = Number(from) - Number(to);
  const gainColor = positionsGained > 0 ? "#00FF87" : positionsGained < 0 ? "#FF4444" : "#97989B";

  const stintParts = stStrategy.split("-").map((part) => {
    const compound = part[0];
    const endLap = part.slice(1);
    const colors: Record<string, string> = {
      S: "#DA291C",
      M: "#FFD700",
      H: "#FFFFFF",
    };
    const labels: Record<string, string> = { S: "Soft", M: "Medium", H: "Hard" };
    return {
      color: colors[compound] ?? "#FFFFFF",
      label: labels[compound] ?? compound,
      endLap,
    };
  });

  return new ImageResponse(
    (
      <div
        style={{
          width: "1200px",
          height: "630px",
          background: "linear-gradient(180deg, #0a0a1a 0%, #0d1117 100%)",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "32px 40px",
          fontFamily: "Chakra Petch",
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: "4px",
            background: "#E10600",
          }}
        />

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <span
              style={{
                color: "#E10600",
                fontSize: "14px",
                fontWeight: 700,
                letterSpacing: "3px",
                textTransform: "uppercase" as const,
              }}
            >
              F1 WHAT-IF ENGINE
            </span>
            <span style={{ color: "#333", fontSize: "14px" }}>|</span>
            <span
              style={{
                color: "#97989B",
                fontSize: "13px",
                letterSpacing: "2px",
                textTransform: "uppercase" as const,
              }}
            >
              RACE SIMULATION
            </span>
          </div>
          <span
            style={{
              color: "#97989B",
              fontSize: "13px",
              letterSpacing: "2px",
              textTransform: "uppercase" as const,
            }}
          >
            {raceName}
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "32px" }}>
          <div
            style={{
              border: `3px solid ${driverTeamColor}`,
              borderRadius: "16px",
              padding: "20px 32px",
              textAlign: "center",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <span
              style={{
                color: driverTeamColor,
                fontSize: "48px",
                fontWeight: 900,
                fontFamily: "Orbitron",
              }}
            >
              {driverNumber}
            </span>
            <span
              style={{
                color: "#97989B",
                fontSize: "12px",
                letterSpacing: "2px",
                marginTop: "4px",
              }}
            >
              {challenge.driverId}
            </span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
            <span
              style={{
                color: "#FFFFFF",
                fontSize: "28px",
                fontWeight: 700,
                textTransform: "uppercase" as const,
              }}
            >
              {driverName}
            </span>
            <span
              style={{
                color: driverTeamColor,
                fontSize: "14px",
                fontWeight: 700,
                textTransform: "uppercase" as const,
                letterSpacing: "1px",
                marginTop: "4px",
              }}
            >
              {driver?.team ?? ""}
            </span>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "24px",
                marginTop: "20px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                }}
              >
                <span
                  style={{
                    color: "#666",
                    fontSize: "11px",
                    textTransform: "uppercase" as const,
                    letterSpacing: "2px",
                  }}
                >
                  ORIGINAL
                </span>
                <span
                  style={{
                    color: "#97989B",
                    fontSize: "40px",
                    fontWeight: 900,
                    fontFamily: "Orbitron",
                  }}
                >
                  P{from}
                </span>
              </div>
              <span style={{ color: gainColor, fontSize: "28px" }}>→</span>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                }}
              >
                <span
                  style={{
                    color: "#666",
                    fontSize: "11px",
                    textTransform: "uppercase" as const,
                    letterSpacing: "2px",
                  }}
                >
                  RESULT
                </span>
                <span
                  style={{
                    color: gainColor,
                    fontSize: "40px",
                    fontWeight: 900,
                    fontFamily: "Orbitron",
                  }}
                >
                  P{to}
                </span>
              </div>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  marginLeft: "16px",
                }}
              >
                <span
                  style={{
                    color: "#666",
                    fontSize: "11px",
                    textTransform: "uppercase" as const,
                    letterSpacing: "2px",
                  }}
                >
                  SCORE
                </span>
                <span
                  style={{
                    color: "#FFD700",
                    fontSize: "40px",
                    fontWeight: 900,
                    fontFamily: "Orbitron",
                  }}
                >
                  {score}
                </span>
              </div>
            </div>
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <span
              style={{
                color: "#97989B",
                fontSize: "10px",
                letterSpacing: "2px",
                textTransform: "uppercase" as const,
              }}
            >
              STRATEGY
            </span>
            {stintParts.map((stint, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <div
                  style={{
                    width: "16px",
                    height: "16px",
                    borderRadius: "50%",
                    background: stint.color,
                  }}
                />
                <span style={{ color: "#97989B", fontSize: "13px" }}>
                  L{i === 0 ? "1" : stintParts[i - 1].endLap}-{stint.endLap}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span
            style={{
              color: "#FFD700",
              fontSize: "14px",
              fontWeight: 700,
              letterSpacing: "3px",
              textTransform: "uppercase" as const,
            }}
          >
            ★ {tier} ★
          </span>
          <span
            style={{
              color: "#E10600",
              fontSize: "15px",
              fontWeight: 700,
            }}
          >
            Can you beat my strategy? →
          </span>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      fonts: [
        {
          name: "Orbitron",
          data: orbitronData,
          weight: 900,
          style: "normal",
        },
        {
          name: "Chakra Petch",
          data: chakraData,
          weight: 700,
          style: "normal",
        },
      ],
    }
  );
}
