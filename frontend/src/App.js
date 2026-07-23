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
      <div id="main-content" className="flex-1 flex overflow-hidden" tabIndex={-1}>{children}</div>
    </div>
  );
}

export default function App() {
  return (
    <AppStateProvider>
      <BrowserRouter>
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:px-3 focus:py-2 focus:bg-navy focus:text-white focus:rounded focus:text-sm focus:font-medium"
        >
          Skip to main content
        </a>
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
