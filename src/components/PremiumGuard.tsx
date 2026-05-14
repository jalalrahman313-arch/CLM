"use client"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Crown, MessageCircle } from "lucide-react"

interface PremiumGuardProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  feature?: string
}

export function PremiumGuard({ open, onOpenChange, feature }: PremiumGuardProps) {
  const whatsappNumber = "923394115114"
  const message = encodeURIComponent("السلام علیکم! میں پریمیم اکاؤنٹ حاصل کرنا چاہتا ہوں۔")
  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${message}`

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm text-center rounded-2xl">
        <DialogHeader className="items-center">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center mb-2 shadow-lg shadow-amber-500/25">
            <Crown className="h-8 w-8 text-white" />
          </div>
          <DialogTitle className="text-xl font-bold">پریمیم فیچر</DialogTitle>
          <DialogDescription className="text-base mt-2">
            آپ پریمیم یوزر نہیں ہیں، براہ کرم! رابطہ کریں۔
          </DialogDescription>
        </DialogHeader>
        {feature && (
          <p className="text-sm text-muted-foreground -mt-1">
            ({feature})
          </p>
        )}
        <div className="mt-4 space-y-3">
          <Button
            onClick={() => window.open(whatsappUrl, "_blank")}
            className="w-full bg-[#25D366] hover:bg-[#20bd5a] text-white rounded-xl h-11 text-base font-semibold shadow-lg shadow-green-500/25"
            size="lg"
          >
            <MessageCircle className="h-5 w-5 ml-2" />
            واٹس ایپ پر رابطہ کریں
          </Button>
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            className="w-full rounded-xl"
          >
            بند کریں
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
