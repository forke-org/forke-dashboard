'use client'

import { useEffect, useState } from 'react'
import Lanyard from './Lanyard3D'
import { WAYS, paintBack, paintFoilMask, paintFront, paintStrap, type CardData } from './paint'

import { twoLines, type CardStyle } from './style'

/** The live 3D ID card for one person and one style. Drag it, tap it to flip. */
export default function CardLive({
  data,
  style,
  height = 520,
  flipped,
  pixelRatio,
  interactive = true,
}: {
  data: Omit<CardData, 'quote'>
  style: CardStyle
  height?: number
  /** controlled flip (scripted tours); leave unset to let visitors tap to flip */
  flipped?: boolean
  /** render resolution override when the card is shown scaled up */
  pixelRatio?: number
  interactive?: boolean
}) {
  const [img, setImg] = useState<{ front: string; back: string; strap: string; foil: string } | null>(null)
  const way = WAYS[style.color]
  const key = JSON.stringify([data, style])

  useEffect(() => {
    let alive = true
    ;(async () => {
      const full: CardData = { ...data, quote: twoLines(style.line) }
      const [front, back] = await Promise.all([paintFront(way, full, style.filter), paintBack(way, full)])
      if (!alive) return
      setImg({
        front: front.toDataURL('image/png'),
        back: back.toDataURL('image/png'),
        strap: paintStrap(way).toDataURL('image/png'),
        foil: paintFoilMask().toDataURL('image/png'),
      })
    })()
    return () => {
      alive = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  return (
    <div className="relative mx-auto w-full" style={{ height }}>
      {img && (
        <Lanyard
          frontImage={img.front}
          backImage={img.back}
          strapImage={img.strap}
          foilImage={img.foil}
          cardColor={way.base}
          strapColor={way.base}
          strapWidth={0.8}
          finish="holographic"
          cornerRadius={0.22}
          size={0.66}
          strapLength={0.32}
          breeze={0.25}
          metal="silver"
          flipped={flipped}
          pixelRatio={pixelRatio}
          interactive={interactive}
        />
      )}
    </div>
  )
}
