import { useEffect, useState } from "react";
import { listCategories, listDepartments, listUsers } from "../api";
import useAuth from "./useAuth";
import { canApprove } from "../utils/roles";

/** Loads categories/departments (+users for managers) once and exposes id→object maps. */
export default function useLookups() {
  const { user } = useAuth();
  const [categories, setCategories] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [users, setUsers] = useState([]);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const [cats, depts] = await Promise.all([listCategories(), listDepartments()]);
        if (!alive) return;
        setCategories(cats.data || []);
        setDepartments(depts.data || []);
      } catch { /* lookups are best-effort */ }
      if (canApprove(user)) {
        try {
          const res = await listUsers({ pageSize: 100 });
          if (alive) setUsers(res.data?.items || []);
        } catch { /* ignore */ }
      }
    })();
    return () => { alive = false; };
  }, [user]);

  const categoryName = (id) => categories.find((c) => c.id === id)?.name || "—";
  const departmentName = (id) => departments.find((d) => d.id === id)?.name || "—";
  const userName = (id) => {
    const u = users.find((x) => x.id === id);
    return u ? `${u.firstName} ${u.lastName}` : "—";
  };

  return { categories, departments, users, categoryName, departmentName, userName };
}
