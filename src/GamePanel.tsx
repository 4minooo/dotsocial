import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import {
  choices,
  commitment,
  gomokuWinner,
  putStone,
  salt,
  verifiedResult,
  TURN_MS,
} from "./social/games";
import type { Backend, Choice, Game, Player } from "./social/types";
export default function GamePanel({
  game,
  backend,
  players,
  now,
  onClose,
  onError,
}: {
  game: Game;
  backend: Backend;
  players: Player[];
  now: number;
  onClose: () => void;
  onError: (message: string) => void;
}) {
  const [busy, setBusy] = useState(false),
    [result, setResult] = useState<string | null>(null),
    revealBusy = useRef(false),
    finishBusy = useRef(false);
  const uid = backend.uid,
    host = game.host === uid,
    peer = players.find((p) => p.uid === (host ? game.guest : game.host)),
    peerPresent =
      !!peer && peer.session === (host ? game.guestSession : game.hostSession),
    expired = now >= game.deadline,
    active = game.status === "active" && !expired && peerPresent;
  const secretKey = `dot-social.secret.${game.id}.${uid}`;
  const run = async (work: () => Promise<unknown>) => {
    setBusy(true);
    try {
      await work();
    } catch (e) {
      onError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  useEffect(() => {
    if (
      game.type !== "rps" ||
      !game.reveals?.[game.host] ||
      !game.reveals?.[game.guest]
    )
      return;
    let alive = true;
    void verifiedResult(game)
      .then((r) => {
        if (alive)
          setResult(
            r === "draw"
              ? "무승부! 한 번 더 해볼까요?"
              : (r === "host") === host
                ? "이겼어요! 🎉"
                : "아쉽지만, 다음에 이겨봐요!",
          );
        if (game.status === "active" && !finishBusy.current) {
          finishBusy.current = true;
          void backend
            .mutate(game.id, (g) => ({ ...g, status: "finished" }))
            .catch((e) => {
              finishBusy.current = false;
              onError(e.message);
            });
        }
      })
      .catch((e) => {
        if (alive) setResult(e.message);
      });
    return () => {
      alive = false;
    };
  }, [game, backend, host, onError]);
  useEffect(() => {
    if (
      game.type !== "rps" ||
      game.status !== "active" ||
      !game.commits?.[game.host] ||
      !game.commits?.[game.guest] ||
      game.reveals?.[uid] ||
      revealBusy.current
    )
      return;
    const raw = sessionStorage.getItem(secretKey);
    if (!raw) return;
    const secret = JSON.parse(raw) as { choice: Choice; salt: string };
    revealBusy.current = true;
    void backend
      .mutate(game.id, (g) => ({
        ...g,
        reveals: { ...g.reveals, [uid]: secret },
      }))
      .catch((e) => {
        revealBusy.current = false;
        onError(e.message);
      });
  }, [game, backend, uid, secretKey, onError]);
  const choose = (choice: Choice) =>
    run(async () => {
      const nonce = salt(),
        hash = await commitment(game.id, uid, choice, nonce);
      sessionStorage.setItem(
        secretKey,
        JSON.stringify({ choice, salt: nonce }),
      );
      await backend.mutate(game.id, (g) => {
        if (
          g.commits?.[uid] ||
          g.status !== "active" ||
          backend.now() >= g.deadline
        )
          throw new Error("선택 시간이 지났거나 이미 선택했어요.");
        return { ...g, commits: { ...g.commits, [uid]: hash } };
      });
    });
  const close = () =>
    run(async () => {
      if (game.status === "invited")
        await backend.mutate(game.id, (g) => ({
          ...g,
          status: host ? "cancelled" : "declined",
        }));
      else if (game.status === "active" && !expired)
        await backend.mutate(game.id, (g) => ({ ...g, status: "aborted" }));
      sessionStorage.removeItem(secretKey);
      onClose();
    });
  const accept = () =>
    run(() =>
      backend.mutate(game.id, (g) => {
        if (g.status !== "invited" || backend.now() >= g.deadline)
          throw new Error("초대가 만료되었어요.");
        return {
          ...g,
          status: "active",
          deadline: backend.now() + (g.type === "rps" ? 45000 : TURN_MS),
        };
      }),
    );
  const winner = gomokuWinner(game.board, game.host),
    mine = game.next % 2 === 0 ? game.host === uid : game.guest === uid;
  const title = game.type === "rps" ? "가위바위보" : "오목";
  return (
    <div className="modal-backdrop">
      <section
        className={`game-modal ${game.type === "gomoku" ? "gomoku-modal" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="game-title"
      >
        <button
          className="modal-close icon-btn"
          onClick={close}
          disabled={busy}
          aria-label="게임 닫기"
        >
          <X size={19} />
        </button>
        <p className="eyebrow">A LITTLE PLAY TOGETHER</p>
        <h2 id="game-title">{title}</h2>
        <p className="game-opponent">
          {peer?.profile.nickname ?? "떠난 친구"} 님과{" "}
          {host ? "당신이 먼저" : "상대가 먼저"} ·{" "}
          {game.type === "gomoku" ? "15×15 렌주 금수 · 착수 10초" : "1대1 단판"}
        </p>
        {!peerPresent ? (
          <div className="game-result">상대방이 공간을 떠났어요.</div>
        ) : expired && ["active", "invited"].includes(game.status) ? (
          <div className="game-result" role="status">
            {game.type === "gomoku" && game.status === "active"
              ? mine
                ? "착수 시간 초과로 패배했어요."
                : "상대방 착수 시간 초과로 이겼어요! 🎉"
              : "제한 시간이 끝났어요."}
          </div>
        ) : game.status === "invited" ? (
          <div className="invite-content">
            <span>{game.type === "rps" ? "✊" : "⚫"}</span>
            <h3>{host ? "초대를 보냈어요." : "같이 한 판 할까요?"}</h3>
            <p>
              {host
                ? "상대방이 수락하면 시작돼요."
                : "부담 없이 가볍게 즐겨요."}
            </p>
            {!host && (
              <button className="enter-button" onClick={accept} disabled={busy}>
                초대 수락
              </button>
            )}
            <button
              className="secondary-button"
              onClick={close}
              disabled={busy}
            >
              {host ? "초대 취소" : "거절"}
            </button>
          </div>
        ) : ["declined", "cancelled", "aborted"].includes(game.status) ? (
          <div className="game-result">
            {game.status === "declined"
              ? "초대를 거절했어요."
              : game.status === "aborted"
                ? "게임을 종료했어요."
                : "초대가 취소되었어요."}
          </div>
        ) : game.type === "rps" ? (
          <>
            <div className="rps-options">
              {(Object.keys(choices) as Choice[]).map((c) => (
                <button
                  key={c}
                  aria-label={
                    { rock: "바위", paper: "보", scissors: "가위" }[c]
                  }
                  disabled={busy || !active || !!game.commits?.[uid]}
                  onClick={() => choose(c)}
                >
                  <span>{choices[c]}</span>
                  {{ rock: "바위", paper: "보", scissors: "가위" }[c]}
                </button>
              ))}
            </div>
            <p className="game-status">
              {result ??
                (game.commits?.[uid]
                  ? "선택 완료! 상대방을 기다려요."
                  : "하나를 선택해 주세요.")}
            </p>
            {game.reveals?.[game.host] && game.reveals?.[game.guest] && (
              <div className="revealed-hands">
                <span>{choices[game.reveals[uid].choice]}</span>
                <small>VS</small>
                <span>
                  {choices[game.reveals[host ? game.guest : game.host].choice]}
                </span>
              </div>
            )}
            <p className="muted-note">선택은 양쪽 모두 확정한 후 공개돼요.</p>
          </>
        ) : (
          <>
            <p className="game-status">
              {winner
                ? winner === uid
                  ? "이겼어요! 🎉"
                  : "상대방이 이겼어요."
                : game.next === 225
                  ? "무승부예요."
                  : `${mine ? "내" : "상대방"} 차례 · ${host ? "흑" : "백"}돌`}
            </p>
            <div className="gomoku-board" role="group" aria-label="오목판">
              {Array.from({ length: 225 }, (_, cell) => (
                <button
                  key={cell}
                  aria-label={`${Math.floor(cell / 15) + 1}행 ${(cell % 15) + 1}열`}
                  disabled={busy || !active || !mine || !!game.board?.[cell]}
                  onClick={() =>
                    run(() =>
                      backend.mutate(game.id, (g) =>
                        putStone(g, uid, cell, backend.now()),
                      ),
                    )
                  }
                >
                  {game.board?.[cell] && (
                    <span
                      className={
                        game.board[cell].uid === game.host
                          ? "stone black"
                          : "stone white"
                      }
                      data-last={game.board[cell].n === game.next - 1}
                    />
                  )}
                </button>
              ))}
            </div>
            <p className="muted-note">
              흑: 삼삼·사사·장목 금수, 정확히 5목 승리 · 백: 5목 이상 승리 ·
              자유 오프닝
            </p>
          </>
        )}
        <div className="game-bottom">
          <span>
            {["invited", "active"].includes(game.status) &&
            peerPresent &&
            !expired
              ? `${Math.max(0, Math.ceil((game.deadline - now) / 1000))}초 남음`
              : "게임 종료"}
          </span>
          {!active && game.status !== "invited" && peer && (
            <button
              className="secondary-button"
              disabled={busy}
              onClick={() =>
                run(async () => {
                  await backend.invite(peer, game.type);
                  onClose();
                })
              }
            >
              재대결 제안
            </button>
          )}
          <button className="secondary-button" onClick={close} disabled={busy}>
            {active ? "기권하고 닫기" : "닫기"}
          </button>
        </div>
      </section>
    </div>
  );
}
