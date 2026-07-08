# 1. Bump version
npm version patch   # or minor / major
# 2. Push tags
git push && git push --tags
# 3. Go to GitHub → Releases → "Create a release from tag"
#    → Publish Release  ← this triggers the workflow