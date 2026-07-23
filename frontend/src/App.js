import React from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import { AppStateProvider } from "@/store/appStore";
import { TopBar } from "@/components/layout/TopBar";
import { ReviewQueuePage } from "@/pages/ReviewQueuePage";
import { ReturnWorkspacePage } from "@/pages/ReturnWorkspacePage";
import { ActivityPage } from "@/pages/ActivityPage";
import { DocumentsPage } from "@/pages/DocumentsPage";

function AppShell({ children }) {
  return (
    <div className="h-screen w-full flex flex-col bg-slate-50 overflow-hidden font-ibm-plex text-slate-900">
      <TopBar />
      <div className="flex-1 flex overflow-hidden">{children}</div>
    </div>
  );
}

export default function App() {
  return (
    <AppStateProvider>
      <BrowserRouter>
        <Routes>
          <Route
            path="/"
            element={
              <AppShell>
                <ReviewQueuePage />
              </AppShell>
            }
          />
          <Route
            path="/returns/:returnId"
            element={
              <AppShell>
                <ReturnWorkspacePage />
              </AppShell>
            }
          />
          <Route
            path="/documents"
            element={
              <AppShell>
                <DocumentsPage />
              </AppShell>
            }
          />
          <Route
            path="/activity"
            element={
              <AppShell>
                <ActivityPage />
              </AppShell>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
      <Toaster position="bottom-right" />
    </AppStateProvider>
  );
}
