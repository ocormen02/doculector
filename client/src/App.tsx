import { Routes, Route } from 'react-router-dom'
import { WizardFlow } from './WizardFlow'
import { ManualUploadPage } from './pages/ManualUploadPage'

export default function App() {
  return (
    <Routes>
      <Route path="/manual-upload" element={<ManualUploadPage />} />
      <Route path="/*" element={<WizardFlow />} />
    </Routes>
  )
}
