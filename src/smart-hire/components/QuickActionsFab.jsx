import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaBriefcase,
  FaBullhorn,
  FaCalendarAlt,
  FaInbox,
  FaPlus,
  FaTimes,
} from "react-icons/fa";

const QUICK_ACTIONS = [
  {
    label: "Post a Job",
    icon: <FaBriefcase />,
    path: "/jobs",
    color: "from-teal-500 to-emerald-600",
  },
  {
    label: "Bulk Send",
    icon: <FaBullhorn />,
    path: "/bulk-actions",
    color: "from-green-500 to-emerald-600",
  },
  {
    label: "Schedule Interview",
    icon: <FaCalendarAlt />,
    path: "/interview-schedule",
    color: "from-orange-500 to-amber-600",
  },
  {
    label: "Mail Inbox",
    icon: <FaInbox />,
    path: "/mail-inbox",
    color: "from-pink-500 to-rose-600",
  },
];

const FAB_SIZE = 56;
const EDGE_MARGIN = 16;
const DRAG_THRESHOLD = 6;

const clampPosition = ({ x, y }) => ({
  x: Math.min(Math.max(x, EDGE_MARGIN), window.innerWidth - FAB_SIZE - EDGE_MARGIN),
  y: Math.min(Math.max(y, EDGE_MARGIN), window.innerHeight - FAB_SIZE - EDGE_MARGIN),
});

// Bottom-right corner — dragging only repositions it for the current visit;
// a page refresh always starts back here.
const defaultPosition = () =>
  clampPosition({
    x: window.innerWidth - FAB_SIZE - EDGE_MARGIN,
    y: window.innerHeight - FAB_SIZE - EDGE_MARGIN,
  });

function QuickActionsFab() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState(defaultPosition);
  const dragState = useRef(null);

  useEffect(() => {
    const handleResize = () => setPosition((prev) => clampPosition(prev));
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handlePointerDown = (e) => {
    dragState.current = {
      startX: e.clientX,
      startY: e.clientY,
      originX: position.x,
      originY: position.y,
      dragged: false,
    };
    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
  };

  const handlePointerMove = (e) => {
    const drag = dragState.current;
    if (!drag) return;

    const dx = e.clientX - drag.startX;
    const dy = e.clientY - drag.startY;

    if (!drag.dragged && Math.hypot(dx, dy) < DRAG_THRESHOLD) return;

    drag.dragged = true;
    setOpen(false);
    setPosition(clampPosition({ x: drag.originX + dx, y: drag.originY + dy }));
  };

  const handlePointerUp = () => {
    window.removeEventListener("pointermove", handlePointerMove);
    window.removeEventListener("pointerup", handlePointerUp);

    const drag = dragState.current;
    dragState.current = null;

    if (!drag?.dragged) {
      setOpen((prev) => !prev);
    }
  };

  // The pill list is sized by its own content, so it's positioned
  // absolutely off the button rather than as a flex sibling — otherwise
  // the button's own box (which we anchor via position.x/y) would grow to
  // fit the wider pills and could push itself past the screen edge.
  const openUpward = position.y > window.innerHeight / 2;
  const openLeft = position.x > window.innerWidth / 2;

  const pillList = (
    <div
      className="absolute flex flex-col gap-2.5"
      style={{
        ...(openUpward ? { bottom: FAB_SIZE + 12 } : { top: FAB_SIZE + 12 }),
        ...(openLeft ? { right: 0, alignItems: "flex-end" } : { left: 0, alignItems: "flex-start" }),
      }}
    >
      {QUICK_ACTIONS.map((action, index) => (
        <button
          key={action.path}
          onClick={() => {
            navigate(action.path);
            setOpen(false);
          }}
          style={{ animationDelay: `${index * 40}ms` }}
          className={`flex items-center gap-3 bg-white py-1.5 rounded-full shadow-lg border border-slate-100 hover:shadow-xl transition-all duration-200 animate-fab-in ${
            openLeft ? "pl-4 pr-1.5 hover:-translate-x-1" : "pr-4 pl-1.5 flex-row-reverse hover:translate-x-1"
          }`}
        >
          <span className="font-semibold text-slate-700 text-sm whitespace-nowrap">
            {action.label}
          </span>
          <span
            className={`w-9 h-9 rounded-full bg-gradient-to-br ${action.color} flex items-center justify-center text-white text-sm flex-shrink-0`}
          >
            {action.icon}
          </span>
        </button>
      ))}
    </div>
  );

  return (
    <div
      className="fixed z-40"
      style={{
        left: position.x,
        top: position.y,
        width: FAB_SIZE,
        height: FAB_SIZE,
      }}
    >
      {open && pillList}

      <button
        onPointerDown={handlePointerDown}
        title="Quick Actions — drag to move"
        className={`w-14 h-14 rounded-full text-white text-xl flex items-center justify-center shadow-xl hover:shadow-2xl transition-all duration-300 touch-none cursor-grab active:cursor-grabbing ${
          open
            ? "bg-gradient-to-br from-rose-500 to-red-600"
            : "bg-gradient-to-br from-teal-500 to-emerald-600"
        }`}
      >
        <span
          className={`inline-flex transition-transform duration-300 ${
            open ? "rotate-180" : "rotate-0"
          }`}
        >
          {open ? <FaTimes size={20} /> : <FaPlus size={20} />}
        </span>
      </button>
    </div>
  );
}

export default QuickActionsFab;
