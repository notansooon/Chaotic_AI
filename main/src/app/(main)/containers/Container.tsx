'use client'

import { useState } from 'react'
import { Play, RotateCcw, MoreVertical, Cpu, MemoryStick } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'

type Container = {
  id: string
  name: string
  region: string
  status: 'RUNNING' | 'PENDING' | 'STOPPED'
  cpu: number
  memory: number
  restarts: number
  uptime: string
  group: string
}

const containers: Container[] = [
  { id: '1', name: 'custom-worker', region: 'garage-eu-west-1', status: 'PENDING', cpu: 0.001, memory: 128, restarts: 0, uptime: '2m', group: 'Custom' },
  { id: '2', name: 'custom-app-1', region: 'garage-us-west-2', status: 'RUNNING', cpu: 0.078, memory: 640, restarts: 3, uptime: '5d', group: 'Custom' },
  { id: '3', name: 'load-balancer', region: 'garage-us-east-1', status: 'RUNNING', cpu: 0.045, memory: 512, restarts: 0, uptime: '20d', group: 'Services' },
  { id: '4', name: 'nginx-service', region: 'garage-us-east-1', status: 'RUNNING', cpu: 0.034, memory: 384, restarts: 0, uptime: '20d', group: 'Services' },
  { id: '5', name: 'api-backend-pod-2', region: 'garage-us-east-1', status: 'RUNNING', cpu: 0.062, memory: 512, restarts: 1, uptime: '7d', group: 'Pods' },
  { id: '6', name: 'api-backend-pod-1', region: 'garage-us-east-1', status: 'RUNNING', cpu: 0.061, memory: 512, restarts: 1, uptime: '7d', group: 'Pods' },
]

export default function ContainersPage() {
  const [selected, setSelected] = useState<string[]>([])

  const groups = [...new Set(containers.map(c => c.group))]

  const toggleSelect = (id: string) => {
    setSelected(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'RUNNING': return 'bg-green-500/10 text-green-500'
      case 'PENDING': return 'bg-yellow-500/10 text-yellow-500'
      case 'STOPPED': return 'bg-gray-500/10 text-gray-500'
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Containers</h1>
        <Button variant="outline">Filters</Button>
      </div>

      <input
        type="text"
        placeholder="Search containers..."
        className="w-full border rounded-lg p-2 px-4 text-sm bg-background"
      />

      {groups.map(group => (
        <div key={group}>
          <h2 className="mt-6 mb-2 text-lg font-semibold text-muted-foreground">{group}</h2>
          <div className="grid gap-3">
            {containers.filter(c => c.group === group).map(container => (
              <Card
                key={container.id}
                className="flex items-center justify-between px-4 py-3 hover:bg-accent/40 transition"
              >
                <div className="flex items-center gap-3">
                  <Checkbox
                    checked={selected.includes(container.id)}
                    onCheckedChange={() => toggleSelect(container.id)}
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{container.name}</span>
                      <Badge className={getStatusColor(container.status)}>
                        {container.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {container.region} • Uptime {container.uptime}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  <div className="text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Cpu size={12} /> {container.cpu.toFixed(3)} CPU
                    </div>
                    <Progress value={container.cpu * 100} className="h-1 mt-1" />
                  </div>
                  <div className="text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <MemoryStick size={12} /> {container.memory} Mi
                    </div>
                    <Progress value={(container.memory / 1024) * 100} className="h-1 mt-1" />
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Restarts: {container.restarts}
                  </div>

                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon">
                      <Play size={16} />
                    </Button>
                    <Button variant="ghost" size="icon">
                      <RotateCcw size={16} />
                    </Button>
                    <Button variant="ghost" size="icon">
                      <MoreVertical size={16} />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
