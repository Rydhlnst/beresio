"use client"

import { motion } from "framer-motion"
import { SectionCTAContent, type SectionCTAProps } from "./SectionCTAContent"

export function SectionCTAClient({
    title,
    description,
    primaryLabel,
    primaryHref,
    secondaryLabel,
    secondaryHref
}: SectionCTAProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
        >
            <SectionCTAContent
                title={title}
                description={description}
                primaryLabel={primaryLabel}
                primaryHref={primaryHref}
                secondaryLabel={secondaryLabel}
                secondaryHref={secondaryHref}
            />
        </motion.div>
    )
}
