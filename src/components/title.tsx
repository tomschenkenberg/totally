"use client"

import React from "react"

type TitleProps = {
    children: React.ReactNode
}

const Title: React.FC<TitleProps> = ({ children }) => {
    return <h1 className="text-2xl font-bold text-center text-white tracking-tight">{children}</h1>
}

export default Title
