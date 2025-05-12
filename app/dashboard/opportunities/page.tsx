import { Button } from "@/components/ui/button"
import { PlusCircle } from "lucide-react"
import { OpportunitiesTable } from "./opportunities-table"

export default function OpportunitiesPage() {
  return (
    <div className="flex-1 space-y-4 p-6 max-w-full">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Oportunidades</h2>
        <div className="flex items-center space-x-2">
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" />
            Añadir Oportunidad
          </Button>
        </div>
      </div>
      <OpportunitiesTable />
    </div>
  )
}
