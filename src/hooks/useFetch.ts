import useSWR from "swr";
import useSWRMutation from "swr/mutation";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function useFetch<Datos>(url: string | null) {
  return useSWR<Datos>(url, fetcher);
}

export function useMutacion<Datos>(
  url: string,
  metodo: "POST" | "PUT" | "DELETE" = "POST"
) {
  return useSWRMutation<Datos>(
    url,
    async (u: string, { arg }: { arg?: unknown }) => {
      const res = await fetch(u, {
        method: metodo,
        headers: { "Content-Type": "application/json" },
        body: arg ? JSON.stringify(arg) : undefined,
      });
      if (!res.ok) {
        const error = await res.json().catch(() => ({ error: "Error desconocido" }));
        throw new Error(error.error ?? "Error de red");
      }
      return res.json();
    }
  );
}
