import { useEffect, useRef, type RefObject } from "react";
export default function DirectionPad({
  keys,
  disabled,
}: {
  keys: RefObject<Set<string>>;
  disabled: boolean;
}) {
  const pointers = useRef(new Map<number, string>());
  const clear = () => {
    pointers.current.clear();
    keys.current.clear();
  };
  useEffect(() => {
    clear();
    window.addEventListener("blur", clear);
    document.addEventListener("visibilitychange", clear);
    return () => {
      clear();
      window.removeEventListener("blur", clear);
      document.removeEventListener("visibilitychange", clear);
    };
  }, [disabled, keys]);
  return (
    <div className="direction-pad" role="group" aria-label="화면 방향키">
      {(
        [
          ["ArrowUp", "위", "↑"],
          ["ArrowLeft", "왼쪽", "←"],
          ["ArrowDown", "아래", "↓"],
          ["ArrowRight", "오른쪽", "→"],
        ] as const
      ).map(([key, label, icon]) => (
        <button
          key={key}
          className={key}
          aria-label={`${label}${label === "위" || label === "아래" ? "로" : "으로"} 이동`}
          disabled={disabled}
          onPointerDown={(e) => {
            e.preventDefault();
            (document.activeElement as HTMLElement)?.blur();
            e.currentTarget.setPointerCapture(e.pointerId);
            pointers.current.set(e.pointerId, key);
            keys.current.add(key);
          }}
          onPointerUp={(e) => {
            pointers.current.delete(e.pointerId);
            if (![...pointers.current.values()].includes(key))
              keys.current.delete(key);
          }}
          onPointerCancel={clear}
          onLostPointerCapture={(e) => {
            pointers.current.delete(e.pointerId);
            if (![...pointers.current.values()].includes(key))
              keys.current.delete(key);
          }}
          onKeyDown={(e) => {
            if (e.key === " " || e.key === "Enter") {
              e.preventDefault();
              keys.current.add(key);
            }
          }}
          onKeyUp={() => keys.current.delete(key)}
          onBlur={() => keys.current.delete(key)}
        >
          {icon}
        </button>
      ))}
      <span>누르고 이동</span>
    </div>
  );
}
