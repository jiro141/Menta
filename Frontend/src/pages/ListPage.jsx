import { useParams } from "react-router-dom";
import ListView from "../components/list/ListView";

export default function ListPage() {
  const params = useParams();
  const proyectoId = params.proyectoId;
  
  return <ListView proyectoId={proyectoId} />;
}