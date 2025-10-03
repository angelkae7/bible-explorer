import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ApiProvider } from "./BibleExplorer";
import LandingPage from "./pages/LandingPage";
import BooksPage from "./pages/BooksPage";
import BookDetailsPage from "./pages/BookDetailsPage";
import ChaptersPage from "./pages/ChaptersPage";
import ReaderPage from "./pages/ReaderPage";

export default function App() {
  return (
    <ApiProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/books" element={<BooksPage />} />
          <Route path="/books/:bookId" element={<BookDetailsPage />} />
          <Route path="/books/:bookId/chapters" element={<ChaptersPage />} />
          <Route path="/read/:chapterId" element={<ReaderPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </ApiProvider>
  );
}
