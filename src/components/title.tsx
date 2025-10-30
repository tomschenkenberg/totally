"use client"

import React from "react"

type TitleProps = {
    children: React.ReactNode
}

const Title: React.FC<TitleProps> = ({ children }) => {
    return <h1 className="text-3xl font-bold text-center mb-4 text-gray-200">{children}</h1>
}

export default Title
