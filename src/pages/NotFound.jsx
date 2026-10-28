import { Link } from "react-router"
import Nodo from "../components/Nodo"

export default function NotFound({ what = "página" }) {
  return (
    <div className="container-page flex flex-col items-center py-24 text-center">
      <Nodo size={190} mood="sleep" title="Nodo se quedó dormido" />
      <h1 className="mt-6 text-3xl font-bold sm:text-4xl">No encontramos esa {what}</h1>
      <p className="mt-3 max-w-md text-muted">
        {what === "skill"
          ? "Puede que su autor la haya movido o borrado del repositorio. Búscala en el explorador."
          : "La dirección no existe. Vuelve al inicio o explora el catálogo."}
      </p>
      <div className="mt-8 flex gap-3">
        <Link to="/" className="btn-ghost">Ir al inicio</Link>
        <Link to="/explorar" className="btn-primary">Explorar skills</Link>
      </div>
    </div>
  )
}
