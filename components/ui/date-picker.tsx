"use client"

import * as React from "react"
import { CalendarIcon } from "lucide-react"

import { Calendar } from "@/components/ui/calendar"
import { Field } from "@/components/ui/field"
import { Label } from "@/components/ui/label"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

function formatDate(date: Date | undefined) {
  if (!date) {
    return ""
  }

  return date.toLocaleDateString("en-US", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  })
}

function isValidDate(date: Date | undefined) {
  if (!date) {
    return false
  }
  return !isNaN(date.getTime())
}

function parseDateValue(value: string | undefined) {
  if (!value) {
    return undefined
  }

  const normalizedValue = /^\d{4}-\d{2}-\d{2}$/.test(value)
    ? new Date(`${value}T00:00:00`)
    : new Date(value)

  return isValidDate(normalizedValue) ? normalizedValue : undefined
}

function toIsoDate(date: Date | undefined) {
  if (!date || !isValidDate(date)) {
    return ""
  }

  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")

  return `${year}-${month}-${day}`
}

export function DatePickerInput({
  fieldLabel,
  id = "date-required",
  value: selectedValue,
  onChange,
}: {
  fieldLabel: string
  id?: string
  value?: string
  onChange?: (value: string) => void
}) {
  const [open, setOpen] = React.useState(false)
  const [date, setDate] = React.useState<Date | undefined>(parseDateValue(selectedValue))
  const [month, setMonth] = React.useState<Date | undefined>(date)
  const [inputValue, setInputValue] = React.useState(formatDate(date))

  React.useEffect(() => {
    const nextDate = parseDateValue(selectedValue)
    setDate(nextDate)
    setMonth(nextDate)
    setInputValue(formatDate(nextDate))
  }, [selectedValue])

  return (
    <Field className="mx-auto w-48">
      <Label htmlFor={id}>{fieldLabel}</Label>
      <InputGroup>
        <InputGroupInput
          id={id}
          value={inputValue}
          placeholder="June 01, 2025"
          onChange={(e) => {
            const date = new Date(e.target.value)
            setInputValue(e.target.value)
            if (isValidDate(date)) {
              setDate(date)
              setMonth(date)
              onChange?.(toIsoDate(date))
            }
          }}
          onBlur={() => {
            setInputValue(formatDate(date))
          }}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") {
              e.preventDefault()
              setOpen(true)
            }
          }}
        />
        <InputGroupAddon align="inline-end">
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <InputGroupButton
                id="date-picker"
                variant="ghost"
                size="icon-xs"
                aria-label="Select date"
              >
                <CalendarIcon />
                <span className="sr-only">Select date</span>
              </InputGroupButton>
            </PopoverTrigger>
            <PopoverContent
              className="w-auto overflow-hidden p-0"
              align="end"
              alignOffset={-8}
              sideOffset={10}
            >
              <Calendar
                mode="single"
                selected={date}
                month={month}
                onMonthChange={setMonth}
                onSelect={(date) => {
                  setDate(date)
                  setInputValue(formatDate(date))
                  onChange?.(toIsoDate(date))
                  setOpen(false)
                }}
              />
            </PopoverContent>
          </Popover>
        </InputGroupAddon>
      </InputGroup>
    </Field>
  )
}
