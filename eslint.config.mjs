import path from "node:path"
import { fileURLToPath } from "node:url"
import js from "@eslint/js"
import { FlatCompat } from "@eslint/eslintrc"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const compat = new FlatCompat({
    baseDirectory: __dirname,
    recommendedConfig: js.configs.recommended,
    allConfig: js.configs.all
})

const config = [
    ...compat.extends("next/core-web-vitals", "next/typescript"),
    {
        rules: {
            "no-unused-expressions": "off",
            "no-unused-vars": "off",
            "no-explicit-any": "off",
            "no-empty-object-type": "off",
            "@typescript-eslint/no-unused-vars": "off",
            "@typescript-eslint/no-require-imports": "off",
            "@typescript-eslint/no-var-requires": "off"
        }
    }
]

export default config
