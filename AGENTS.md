<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- All AI tools call the shared server-only Gemini handler through server functions; resolve credentials inside each handler to keep secrets out of browser code.
- Provider failures are logged as sanitized structured diagnostics and shown as errors, never substituted with generated sample results, so failed requests remain diagnosable.
