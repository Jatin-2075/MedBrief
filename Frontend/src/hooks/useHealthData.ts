/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useContext } from "react";
import { HealthDataContext } from "../context/HealthDataContext";

export function useHealthData() {
  const context = useContext(HealthDataContext);
  if (context === undefined) {
    throw new Error("useHealthData must be used within a HealthDataProvider");
  }
  return {
    doctors: context.doctors,
    medicines: context.medicines,
    reports: context.reports,
    analyses: context.analyses,
    prescriptions: context.prescriptions,
    appointments: context.appointments,
    chatMessages: context.chatMessages,
    addHealthReport: context.addHealthReport,
    bookAppointment: context.bookAppointment,
    addPrescription: context.addPrescription,
    sendChatMessage: context.sendChatMessage,
    clearChatHistory: context.clearChatHistory
  };
}
