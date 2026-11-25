"use client";

import LogoutOutlinedIcon from "@mui/icons-material/LogoutOutlined";
import Button from "@mui/material/Button";
import { authClient } from "@/lib/auth/auth-client";
import { PATH_SIGN_IN } from "@/routes";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function LogoutButton() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleClick() {
    setIsSubmitting(true);

    try {
      await authClient.signOut();
      router.replace(PATH_SIGN_IN);
      router.refresh();
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Button
      type="button"
      onClick={handleClick}
      disabled={isSubmitting}
      variant="outlined"
      fullWidth
      size="small"
      startIcon={<LogoutOutlinedIcon />}
      sx={{ mt: 1.5 }}
    >
      {isSubmitting ? "Logging out..." : "Logout"}
    </Button>
  );
}
