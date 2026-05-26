/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useContext } from "react";
import { HealthDataContext } from "../context/HealthDataContext";

export function useTheme() {
  const context = useContext(HealthDataContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a HealthDataProvider");
  }
  return {
    theme: context.theme,
    toggleTheme: () => {
      context.setTheme(context.theme === "Midnight Violet" ? "Arctic Blue" : "Midnight Violet");
    },
    setTheme: context.setTheme
  };
}
