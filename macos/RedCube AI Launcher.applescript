on run
	set appPath to POSIX path of (path to me)
	set repoPath to do shell script "dirname " & quoted form of appPath
	do shell script "cd " & quoted form of repoPath & " && ./scripts/launch-redcube-web.sh >/dev/null 2>&1"
end run
