import { useState } from "react"

/** Avatar del dueño del repo; si no carga, muestra su inicial. */
export function RepoAvatar({ skill, owner, src, size = 24 }) {
  const [failed, setFailed] = useState(false)
  const name = owner ?? skill?.repo_owner ?? "?"
  const url = src ?? skill?.owner_avatar_url
  if (!url || failed) {
    return (
      <span
        className="inline-grid shrink-0 place-items-center rounded-full bg-dusk-2 font-display text-[10px] font-bold text-amber"
        style={{ width: size, height: size }}
        aria-hidden
      >
        {name.charAt(0).toUpperCase()}
      </span>
    )
  }
  return (
    <img
      src={`${url}${url.includes("?") ? "&" : "?"}s=${size * 2}`}
      alt=""
      width={size}
      height={size}
      loading="lazy"
      onError={() => setFailed(true)}
      className="shrink-0 rounded-full ring-1 ring-line"
    />
  )
}
