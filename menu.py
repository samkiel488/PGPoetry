#!/usr/bin/env python3
"""
PGPoetry Server Management Menu
A simple command-line interface for managing the Node.js server
"""

import os
import sys
import subprocess
import signal
import time
from pathlib import Path

class ServerManager:
    def __init__(self):
        self.server_process = None
        self.server_url = "http://localhost:3000"

    def is_server_running(self):
        """Check if server is currently running"""
        if self.server_process is None:
            return False
        return self.server_process.poll() is None

    def start_server(self):
        """Start the Node.js server"""
        if self.is_server_running():
            print("Server is already running!")
            return

        try:
            print("Starting server...")
            # Change to the project directory
            os.chdir(Path(__file__).parent)

            # Start the server using npm start
            self.server_process = subprocess.Popen(
                ["npm", "start"],
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True
            )

            # Wait a moment for server to start
            time.sleep(2)

            if self.is_server_running():
                print(f"✅ Server started successfully!")
                print(f"🌐 Server URL: {self.server_url}")
            else:
                print("❌ Failed to start server")
                # Print any error output
                if self.server_process:
                    stdout, stderr = self.server_process.communicate()
                    if stderr:
                        print(f"Error: {stderr}")

        except FileNotFoundError:
            print("❌ npm not found. Please make sure Node.js and npm are installed.")
        except Exception as e:
            print(f"❌ Error starting server: {e}")

    def reset_server(self):
        """Reset (restart) the server"""
        print("Resetting server...")
        self.stop_server()
        time.sleep(1)
        self.start_server()

    def stop_server(self):
        """Stop the server"""
        if not self.is_server_running():
            print("Server is not running.")
            return

        try:
            print("Stopping server...")
            if sys.platform == "win32":
                # Windows
                self.server_process.terminate()
            else:
                # Unix-like systems
                os.kill(self.server_process.pid, signal.SIGTERM)

            # Wait for process to terminate
            try:
                self.server_process.wait(timeout=5)
            except subprocess.TimeoutExpired:
                # Force kill if it doesn't terminate gracefully
                self.server_process.kill()
                self.server_process.wait()

            print("✅ Server stopped successfully!")
        except Exception as e:
            print(f"❌ Error stopping server: {e}")
        finally:
            self.server_process = None

    def show_server_link(self):
        """Display the server URL"""
        if self.is_server_running():
            print(f"🌐 Server is running at: {self.server_url}")
        else:
            print(f"🔴 Server is not running. Expected URL: {self.server_url}")

    def show_menu(self):
        """Display the main menu"""
        print("\n" + "="*50)
        print("        PGPoetry Server Management Menu")
        print("="*50)
        print("1. Start Server")
        print("2. Reset Server")
        print("3. Show Server Link")
        print("4. Exit")
        print("="*50)

        status = "🟢 Running" if self.is_server_running() else "🔴 Stopped"
        print(f"Server Status: {status}")
        print("="*50)

def main():
    manager = ServerManager()

    while True:
        manager.show_menu()
        try:
            choice = input("Enter your choice (1-4): ").strip()

            if choice == "1":
                manager.start_server()
            elif choice == "2":
                manager.reset_server()
            elif choice == "3":
                manager.show_server_link()
            elif choice == "4":
                if manager.is_server_running():
                    confirm = input("Server is running. Stop it before exiting? (y/n): ").strip().lower()
                    if confirm == "y":
                        manager.stop_server()
                print("Goodbye!")
                break
            else:
                print("❌ Invalid choice. Please enter 1-4.")

        except KeyboardInterrupt:
            print("\n\nInterrupted by user.")
            if manager.is_server_running():
                manager.stop_server()
            break
        except Exception as e:
            print(f"❌ An error occurred: {e}")

        # Wait for user to press enter before showing menu again
        input("\nPress Enter to continue...")

if __name__ == "__main__":
    main()
