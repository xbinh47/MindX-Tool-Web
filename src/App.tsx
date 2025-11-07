import { BrowserRouter, Routes, Route } from "react-router-dom"
import { ThemeProvider } from "@/components/theme-provider"
import MainLayout from "@/components/layouts/main-layout"
import AdminLayout from "@/components/layouts/admin-layout"
import Home from "@/views/home"
import Admin from "@/views/admin"

function App() {
  return (
    <ThemeProvider defaultTheme="light" storageKey="app-theme">
      <BrowserRouter>
        <Routes>
          <Route element={<MainLayout />}>
            <Route path="/" element={<Home />} />
          </Route>
          <Route element={<AdminLayout />}>
            <Route path="/admin" element={<Admin />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  )
}

export default App
