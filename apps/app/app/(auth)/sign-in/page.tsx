"use client";

import * as React from "react";
import { LoginForm as LoginFormAlias } from "../_components/LoginForm";

export default function SignInPage() {
    return (
        <div className="w-full py-4 pb-12">
            <LoginFormAlias />
        </div>
    );
}
