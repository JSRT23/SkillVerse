import { useState } from "react"

/** Avatar del dueño del repo; si no carga, muestra su inicial. */
export function RepoAvatar({ skill, owner, src, size = 24 }) {
  const [failed, setFailed] = useState(false)
  const name = owner ?? skill?.repo_owner ?? "?"
  const url = src ?? skill?.owner_avatar_url
  if (!url || failed) {
    return (
      <span
        className="inline-grid shrink-0 place-items-center rounded-full bg-gradient-to-br from-brand to-orchid font-display font-bold text-white"
        style={{ width: size, height: size, fontSize: Math.max(8, size * 0.45) }}
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
