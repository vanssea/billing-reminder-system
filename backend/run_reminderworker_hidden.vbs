' Peluncur reminderworker tanpa jendela konsol (dipanggil Task Scheduler via wscript.exe).
' Jendela konsol disembunyikan sehingga tidak muncul tiap menit.
' Folder backend di-set sebagai working directory agar reminderworker.exe
' menemukan wa_sessions.db dan .env dari lokasi yang sama.
Const BACKEND = "D:\Magang Otak Kanan\billing reminder\billing-reminder-system\backend"
Set sh = CreateObject("WScript.Shell")
sh.Run "cmd /c cd /d """ & BACKEND & """ && """ & BACKEND & "\reminderworker.exe""", 0, False