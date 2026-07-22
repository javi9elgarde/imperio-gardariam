"use client";

interface BackToRoomProps {
  onClick: () => void;
}

export default function BackToRoom({ onClick }: BackToRoomProps) {
  return (
    <button type="button" className="back-to-room" onClick={onClick}>
      <span aria-hidden>←</span> Volver a la Sala
    </button>
  );
}
