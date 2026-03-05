import * as React from "react"
import { cn } from "./lib/utils"

export const Google = React.forwardRef<SVGSVGElement, React.SVGProps<SVGSVGElement>>(
    ({ className, ...props }, ref) => (
        <svg
            ref={ref}
            viewBox="0 0 268.152 273.883"
            className={cn("h-6 w-auto", className)}
            {...props}
        >
            <defs>
                <linearGradient id="google-a">
                    <stop offset="0" stopColor="#0fbc5c" />
                    <stop offset="1" stopColor="#0cba65" />
                </linearGradient>
                <linearGradient id="google-g">
                    <stop offset=".231" stopColor="#0fbc5f" />
                    <stop offset=".312" stopColor="#0fbc5f" />
                    <stop offset=".366" stopColor="#0fbc5e" />
                    <stop offset=".458" stopColor="#0fbc5d" />
                    <stop offset=".54" stopColor="#12bc58" />
                    <stop offset=".699" stopColor="#28bf3c" />
                    <stop offset=".771" stopColor="#38c02b" />
                    <stop offset=".861" stopColor="#52c218" />
                    <stop offset=".915" stopColor="#67c30f" />
                    <stop offset="1" stopColor="#86c504" />
                </linearGradient>
                <linearGradient id="google-h">
                    <stop offset=".142" stopColor="#1abd4d" />
                    <stop offset=".248" stopColor="#6ec30d" />
                    <stop offset=".312" stopColor="#8ac502" />
                    <stop offset=".366" stopColor="#a2c600" />
                    <stop offset=".446" stopColor="#c8c903" />
                    <stop offset=".54" stopColor="#ebcb03" />
                    <stop offset=".616" stopColor="#f7cd07" />
                    <stop offset=".699" stopColor="#fdcd04" />
                    <stop offset=".771" stopColor="#fdce05" />
                    <stop offset=".861" stopColor="#ffce0a" />
                </linearGradient>
                <linearGradient id="google-f">
                    <stop offset=".316" stopColor="#ff4c3c" />
                    <stop offset=".604" stopColor="#ff692c" />
                    <stop offset=".727" stopColor="#ff7825" />
                    <stop offset=".885" stopColor="#ff8d1b" />
                    <stop offset="1" stopColor="#ff9f13" />
                </linearGradient>
                <linearGradient id="google-b">
                    <stop offset=".231" stopColor="#ff4541" />
                    <stop offset=".312" stopColor="#ff4540" />
                    <stop offset=".458" stopColor="#ff4640" />
                    <stop offset=".54" stopColor="#ff473f" />
                    <stop offset=".699" stopColor="#ff5138" />
                    <stop offset=".771" stopColor="#ff5b33" />
                    <stop offset=".861" stopColor="#ff6c29" />
                    <stop offset="1" stopColor="#ff8c18" />
                </linearGradient>
                <linearGradient id="google-d">
                    <stop offset=".408" stopColor="#fb4e5a" />
                    <stop offset="1" stopColor="#ff4540" />
                </linearGradient>
                <linearGradient id="google-c">
                    <stop offset=".132" stopColor="#0cba65" />
                    <stop offset=".21" stopColor="#0bb86d" />
                    <stop offset=".297" stopColor="#09b479" />
                    <stop offset=".396" stopColor="#08ad93" />
                    <stop offset=".477" stopColor="#0aa6a9" />
                    <stop offset=".568" stopColor="#0d9cc6" />
                    <stop offset=".667" stopColor="#1893dd" />
                    <stop offset=".769" stopColor="#258bf1" />
                    <stop offset=".859" stopColor="#3086ff" />
                </linearGradient>
                <linearGradient id="google-e">
                    <stop offset=".366" stopColor="#ff4e3a" />
                    <stop offset=".458" stopColor="#ff8a1b" />
                    <stop offset=".54" stopColor="#ffa312" />
                    <stop offset=".616" stopColor="#ffb60c" />
                    <stop offset=".771" stopColor="#ffcd0a" />
                    <stop offset=".861" stopColor="#fecf0a" />
                    <stop offset=".915" stopColor="#fecf08" />
                    <stop offset="1" stopColor="#fdcd01" />
                </linearGradient>
            </defs>
            <g transform="matrix(.95792 0 0 .98525 -90.174 -78.856)">
                <path
                    fill="currentColor"
                    d="M371.378 193.24H237.083v53.438h77.167c-1.241 7.563-4.026 15.003-8.105 21.786-4.674 7.773-10.451 13.69-16.373 18.196-17.74 13.498-38.42 16.258-52.783 16.258-36.283 0-67.283-23.286-79.285-54.928-.484-1.149-.805-2.335-1.197-3.507a81.115 81.115 0 0 1-4.101-25.448c0-9.226 1.569-18.057 4.43-26.398 11.285-32.897 42.985-57.467 80.179-57.467 7.481 0 14.685.884 21.517 2.648a77.668 77.668 0 0 1 33.425 18.25l40.834-39.712c-24.839-22.616-57.219-36.32-95.844-36.32-30.878 0-59.386 9.553-82.748 25.7-18.945 13.093-34.483 30.625-44.97 50.985-9.753 18.879-15.094 39.8-15.094 62.294 0 22.495 5.35 43.633 15.103 62.337v.126c10.302 19.857 25.368 36.954 43.678 49.988 15.997 11.386 44.68 26.551 84.031 26.551 22.63 0 42.687-4.051 60.375-11.644 12.76-5.478 24.065-12.622 34.301-21.804 13.525-12.132 24.117-27.139 31.347-44.404 7.23-17.265 11.097-36.79 11.097-57.957 0-9.858-.998-19.87-2.689-28.968Z"
                />
            </g>
        </svg>
    )
)
Google.displayName = "Google"
