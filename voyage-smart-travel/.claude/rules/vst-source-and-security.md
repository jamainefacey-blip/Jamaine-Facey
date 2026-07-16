# Voyage Smart Travel Source and Security Rule

Before any Voyage Smart Travel or Voice Smart Travel audit, repair, deployment, database,
security, or product task:

1. Treat Voice Smart Travel as a module of Voyage Smart Travel, not a separate repository.
2. Use repository `jamainefacey-blip/Jamaine-Facey`, path `voyage-smart-travel/`.
3. Read `voyage-smart-travel/SECURITY_AND_AUDIT_RECOVERY.md`.
4. Treat Vercel project `voyage-smart-travel` and domain `https://voyagesmarttravel.com`
   as the canonical candidates pending live verification.
5. Do not use or expose the committed temporary migration token.
6. Do not call the temporary migration endpoint or pass credentials through request headers.
7. Do not claim migrations are applied without a direct database verification.
8. No production migration, credential rotation, project deletion, or production merge
   without the required approval and independent review.
