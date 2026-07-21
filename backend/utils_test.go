package main

import (
	"encoding/hex"
	"strings"
	"testing"
)

func TestSanitizeText(t *testing.T) {
	cases := []struct {
		in   string
		want string
	}{
		{"<script>alert(1)</script>", "&lt;script&gt;alert(1)&lt;/script&gt;"},
		{`"><img src=x onerror=y>`, "&quot;&gt;&lt;img src=x onerror=y&gt;"},
		{"Tom & Jerry", "Tom &amp; Jerry"},
		{"plain text", "plain text"},
	}
	for _, c := range cases {
		if got := sanitizeText(c.in); got != c.want {
			t.Errorf("sanitizeText(%q) = %q, want %q", c.in, got, c.want)
		}
	}
}

func TestGenerateRandomPassword(t *testing.T) {
	p := generateRandomPassword()
	if len(p) != 24 {
		t.Errorf("expected 24-char hex password, got %d (%q)", len(p), p)
	}
	if _, err := hex.DecodeString(p); err != nil {
		t.Errorf("password is not valid hex: %v", err)
	}
	// 两次调用应不同（随机性）
	if generateRandomPassword() == p {
		t.Errorf("expected two random passwords to differ")
	}
}

func TestGenerateResetCode(t *testing.T) {
	code := generateResetCode()
	if len(code) != 6 {
		t.Errorf("expected 6-digit code, got %q", code)
	}
	if strings.ContainsAny(code, "abcdefABCDEF") {
		t.Errorf("reset code should be numeric, got %q", code)
	}
}
