export interface SelectedVillageInfo {
  id: string | null;
  name: string | null;
}

export const getSelectedVillage = (): SelectedVillageInfo => {
  if (typeof window === "undefined") {
    return { id: null, name: null };
  }

  const id = sessionStorage.getItem("selectedVillageId");
  const name = sessionStorage.getItem("selectedVillageName");

  return { id, name };
};

export const clearSelectedVillage = () => {
  if (typeof window === "undefined") {
    return;
  }

  sessionStorage.removeItem("selectedVillage");
  sessionStorage.removeItem("selectedVillageKey");
  sessionStorage.removeItem("selectedVillageId");
  sessionStorage.removeItem("selectedVillageName");
};

export const getVillageSearchParams = (
  additional?: Record<string, string | undefined | null>
): URLSearchParams => {
  const params = new URLSearchParams();
  const { id } = getSelectedVillage();

  if (id) {
    params.set("village_id", id);
  }

  if (additional) {
    for (const [paramKey, value] of Object.entries(additional)) {
      if (value !== undefined && value !== null) {
        params.set(paramKey, value);
      }
    }
  }

  return params;
};
