' Peluncur reminderworker tanpa jendela konsol (dipanggil Task Scheduler via wscript.exe).
' Jendela konsol disembunyikan sehingga tidak muncul tiap menit.
Set sh = CreateObject("WScript.Shell")
sh.CurrentDirectory = "D:\Intership\billing-reminder-system\backend"
sh.Run """D:\Intership\billing-reminder-system\backend\reminderworker.exe""", 0, False