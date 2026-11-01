/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from '@/src/components/layout/Layout';
import HomePage from '@/src/pages/HomePage';
import ArchivePage from '@/src/pages/ArchivePage';
import AddCharacterPage from '@/src/pages/AddCharacterPage';
import AboutMePage from '@/src/pages/AboutMePage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="about" element={<AboutMePage />} />
          <Route path="about-me" element={<AboutMePage />} />
          <Route path="archive" element={<ArchivePage />} />
          <Route path="add-character" element={<AddCharacterPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

