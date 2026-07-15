import { useState, useEffect } from "react";
import { deriveNameFromPath } from "../utils/path";

/**
 * Manages a name + path pair where the name is auto-derived from the path
 * until the user manually edits the name field.
 *
 * Behaviour:
 * - When the path changes and the user has NOT manually typed a name,
 *   the name is auto-filled from `deriveNameFromPath(path)`.
 * - Once the user types anything into the name field, auto-derivation
 *   stops (so manual edits are preserved).
 * - If the user clears the name field entirely, auto-derivation resumes
 *   on the next path change.
 *
 * `reset()` clears both fields and re-enables auto-derivation — call it
 * after a successful "add" so the next entry starts fresh.
 */
export function useAutoName() {
  const [name, setName] = useState("");
  const [path, setPath] = useState("");
  const [nameTouched, setNameTouched] = useState(false);

  useEffect(() => {
    if (!nameTouched) {
      setName(deriveNameFromPath(path));
    }
  }, [path, nameTouched]);

  const handleNameChange = (value: string) => {
    setName(value);
    // Empty name → let auto-derivation resume on next path change
    setNameTouched(value !== "");
  };

  const handlePathChange = (value: string) => {
    setPath(value);
  };

  const reset = () => {
    setName("");
    setPath("");
    setNameTouched(false);
  };

  return {
    name,
    path,
    setName: handleNameChange,
    setPath: handlePathChange,
    reset,
  };
}
