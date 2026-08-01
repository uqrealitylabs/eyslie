#!/usr/bin/env bash
set -euo pipefail

die() {
  printf '%s\n' "$*" >&2
  exit 1
}

[[ $# -eq 0 || ( $# -eq 1 && $1 == "--check" ) ]] ||
  die "Usage: ./commit.sh [--check]"

cd "$(git rev-parse --show-toplevel 2>/dev/null)" ||
  die "Run commit.sh inside a Git repository."

branch=$(git branch --show-current)
[[ $branch =~ ^[[:alnum:]]+$ && $branch != main ]] ||
  die "Use a one-word non-main branch."
git diff --cached --quiet || die "Refusing a pre-populated index."
git config --get alias.bkcommit >/dev/null ||
  die "git bkcommit is not configured."
[[ $(git config --get gpg.format) == "ssh" ]] ||
  die "Git SSH signing is required."

public_key=$(git config --path --get user.signingkey) ||
  die "Git user.signingkey is not configured."
private_key=${public_key%.pub}
[[ $public_key == *.pub && -f $public_key && -f $private_key ]] ||
  die "The configured SSH signing key is unavailable."
[[ -S ${SSH_AUTH_SOCK:-} ]] || die "An SSH agent is required."

start=$(date -v-1d -v7H -v0M -v0S +%s)
timestamp() {
  date -r "$((start + $1 * 600))" "+%Y-%m-%dT%H:%M:%S%z"
}

if [[ ${1:-} == "--check" ]]; then
  printf 'commit.sh valid; first commit: %s\n' "$(timestamp 0)"
  exit 0
fi

identity=$(awk 'NF >= 2 { print $1 " " $2; exit }' "$public_key")
[[ -n $identity ]] || die "The configured SSH public key is invalid."
if ! ssh-add -L 2>/dev/null | awk 'NF >= 2 { print $1 " " $2 }' |
  grep -Fqx "$identity"; then
  ssh-add -t 15m "$private_key"
fi

index=0
commit_group() {
  local message=$1
  shift
  git add -- "$@"
  git diff --cached --quiet && return
  git bkcommit "$(timestamp "$index")" -S -m "$message"
  index=$((index + 1))
}

commit_group "ci: verify package checks" .github/workflows/checks.yml
commit_group "ci: harden security checks" .github/workflows/security.yml
commit_group "ci: release GitHub and npm packages" .github/workflows/release.yml
commit_group "ci: publish demo to GitHub Pages" .github/workflows/publish.yml
commit_group "build: add progressive commit helper" commit.sh

((index > 0)) || die "No matching changes to commit."
