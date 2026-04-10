"use client"
import { cn } from "@/lib/utils"
import { createContext, useContext, useState } from "react"

const TabsContext = createContext<{ value: string; onChange: (v: string) => void }>({ value: "", onChange: () => {} })

function Tabs({ defaultValue, children, className, ...props }: React.HTMLAttributes<HTMLDivElement> & { defaultValue: string }) {
  const [value, setValue] = useState(defaultValue)
  return (
    <TabsContext.Provider value={{ value, onChange: setValue }}>
      <div className={className} {...props}>{children}</div>
    </TabsContext.Provider>
  )
}

function TabsList({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground", className)} {...props} />
}

function TabsTrigger({ value, className, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { value: string }) {
  const ctx = useContext(TabsContext)
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium transition-all",
        ctx.value === value && "bg-background text-foreground shadow-sm",
        className,
      )}
      onClick={() => ctx.onChange(value)}
      {...props}
    />
  )
}

function TabsContent({ value, className, ...props }: React.HTMLAttributes<HTMLDivElement> & { value: string }) {
  const ctx = useContext(TabsContext)
  if (ctx.value !== value) return null
  return <div className={className} {...props} />
}

export { Tabs, TabsList, TabsTrigger, TabsContent }
