import { Tabs as TabsPrimitive } from '@base-ui/react/tabs'
import type React from 'react'
import { cn } from '@/lib/utils'

// From the cnippet registry (@cnippet/tabs), restyled: tabs use the shared `.ctl` pill and an ink fill when active.

export function Tabs({ className, ...props }: TabsPrimitive.Root.Props): React.ReactElement {
  return <TabsPrimitive.Root className={cn('flex flex-col gap-5', className)} data-slot="tabs" {...props} />
}

export function TabsList({ className, ...props }: TabsPrimitive.List.Props): React.ReactElement {
  return (
    <TabsPrimitive.List className={cn('flex flex-wrap gap-2', className)} data-slot="tabs-list" {...props} />
  )
}

export function TabsTab({ className, ...props }: TabsPrimitive.Tab.Props): React.ReactElement {
  return <TabsPrimitive.Tab className={cn('ctl', className)} data-slot="tabs-tab" {...props} />
}

export function TabsPanel({ className, ...props }: TabsPrimitive.Panel.Props): React.ReactElement {
  return <TabsPrimitive.Panel className={cn('outline-none', className)} data-slot="tabs-content" {...props} />
}
