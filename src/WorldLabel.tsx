import { useEffect, useRef, type RefObject } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Vector3, type Group } from "three";
import { emotes, type Emote } from "./emotes";
// DOM overlays live outside the Three renderer. Plain text never becomes HTML.
export default function WorldLabel({
  anchor,
  nickname,
  emote,
  message,
}: {
  anchor: RefObject<Group | null>;
  nickname: string;
  emote?: Emote;
  message?: string;
}) {
  const { gl, size, camera } = useThree(),
    node = useRef<HTMLDivElement | null>(null),
    content = useRef<HTMLDivElement | null>(null),
    vector = useRef(new Vector3());
  useEffect(() => {
    const root = document.createElement("div");
    root.className = "world-label-root";
    const label = document.createElement("div");
    label.className = "world-label";
    const inner = document.createElement("div");
    inner.className = "world-label-content";
    label.appendChild(inner);
    root.appendChild(label);
    gl.domElement.parentElement!.appendChild(root);
    node.current = label;
    content.current = inner;
    return () => {
      root.remove();
      node.current = null;
      content.current = null;
    };
  }, [gl]);
  useEffect(() => {
    const inner = content.current;
    if (!inner) return;
    inner.replaceChildren();
    if (emote) {
      const icon = document.createElement("span");
      icon.className = "big-emote";
      icon.textContent = emotes[emote].icon;
      icon.setAttribute("aria-label", emotes[emote].label);
      inner.appendChild(icon);
    }
    if (message) {
      const bubble = document.createElement("span");
      bubble.className = "speech-bubble";
      bubble.textContent =
        message.length > 70 ? `${message.slice(0, 70)}…` : message;
      inner.appendChild(bubble);
    }
    const name = document.createElement("span");
    name.className = "nickname-label";
    name.textContent = nickname;
    inner.appendChild(name);
  }, [nickname, emote, message, gl]);
  useFrame(() => {
    if (!anchor.current || !node.current) return;
    anchor.current.getWorldPosition(vector.current);
    vector.current.y += 2.35;
    vector.current.project(camera);
    node.current.style.transform = `translate(${((vector.current.x + 1) * size.width) / 2}px,${((-vector.current.y + 1) * size.height) / 2}px)`;
    node.current.style.visibility = vector.current.z > 1 ? "hidden" : "visible";
  });
  return null;
}
