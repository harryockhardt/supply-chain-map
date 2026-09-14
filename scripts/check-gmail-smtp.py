#!/usr/bin/env python3
"""Interactive Gmail SMTP login check. No emails sent; no credentials stored."""

import getpass
import os
import re
import smtplib
import socket
import ssl
import sys
import warnings


def tls_context():
    # Python.org on macOS may lack its optional CA bundle. Use macOS's CA
    # file in that case; certificate and hostname verification stay enabled.
    context = ssl.create_default_context()
    if not context.get_ca_certs() and sys.platform == "darwin" and os.path.isfile("/etc/ssl/cert.pem"):
        context.load_verify_locations(cafile="/etc/ssl/cert.pem")
    return context


def main():
    print("Gmail connection check — this does not send an email.")
    print("Enter the Gmail address configured as Supabase's SMTP Username.")
    email = input("Gmail address: ").strip()
    if not re.fullmatch(r"[^\s@]+@gmail\.com", email, re.IGNORECASE):
        print("Enter the full @gmail.com address used as your SMTP username.")
        return 2

    # Refuse getpass's fallback to visible input on terminals without echo control.
    with warnings.catch_warnings():
        warnings.simplefilter("error", getpass.GetPassWarning)
        try:
            password = getpass.getpass("Google App Password (typing stays hidden): ")
        except getpass.GetPassWarning:
            print("Run this check in Terminal so the password can stay hidden.")
            return 2
    password = re.sub(r"\s+", "", password)
    if not re.fullmatch(r"[a-z]{16}", password):
        print("This does not match Google's 16-letter App Password format.")
        print("Use the generated App Password, not your normal Gmail password.")
        return 2

    print("Checking Gmail over an encrypted connection…")
    try:
        with smtplib.SMTP("smtp.gmail.com", 587, timeout=20) as smtp:
            smtp.ehlo()
            smtp.starttls(context=tls_context())
            smtp.ehlo()
            smtp.login(email, password)
        print("PASS: Gmail accepted this address and App Password.")
        print("If Supabase still reports 535, re-enter this same address and App Password there and save.")
        return 0
    except smtplib.SMTPAuthenticationError as error:
        print(f"FAIL: Gmail rejected the credentials (SMTP {error.smtp_code}).")
        print("Generate a fresh App Password in this exact Google account and repeat this check.")
        return 1
    except ssl.SSLError:
        print("FAIL: The secure connection could not be verified. No insecure fallback was attempted.")
        return 1
    except (socket.timeout, TimeoutError, OSError):
        print("FAIL: This computer could not connect to Gmail. Check the network and try again.")
        return 1
    except smtplib.SMTPException as error:
        print(f"FAIL: Gmail could not complete the SMTP check ({type(error).__name__}).")
        return 1
    finally:
        password = None


if __name__ == "__main__":
    try:
        sys.exit(main())
    except (KeyboardInterrupt, EOFError):
        print("\nCancelled. No email was sent.")
        sys.exit(2)
