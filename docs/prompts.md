To Do:
- Are all the scripts in /workspaces/interfaces/api-gateway/src/auth/ actually required? I would like to remove any that are unused if possible.
- Can we add a hook in the git commit that blocks if there are TypeScript errors?
- Is the "monitoring" domain complete and functioning as expected?
- You are a Domain Driven Design expert. Please review the repo architecture, focusing on the following aspects:
  - Is the file and directory structure following a strict DDD approach or do we need to relocate?
  - Are the domain boundaries clearly defined?
  - Is there a clear separation of concerns between different domains?
  - Are the entities and value objects well-defined and properly encapsulated?
  - Is the overall architecture aligned with DDD principles?
- I want to be able to permission access to specific apps (such as the upcoming QIS application) per user. How can we implement this so that its configurable from the Dashboard page?
- The Dashboard contains very sensitive data. Please review the security of this page. Only Admins should be able to access it.
- Are the API calls made by the Dashboard page also secure so that we will not expose sensitive system info to users other than the admins?

For Reference:
- Please review all documentation and flag files and test that could be consolidated more concisely
- Please review all documentation and remove any files or text which are simply logs of work done or status reports
- You are an expert test engineer. Please review all the recently deleted test scripts and determine if they were genuinely redundant or if more tests are needed
- We are about to begin working on the plan layed out in docs/qis-plan.md and docs/qis-objective.md taking a strict DDD approach. Before we begin creating the domains/qis-data-management domain, I would like to create a sub plan doc, objectives doc, and  architecture diagrams and class diagrams. The core objective of this domain is to provide the golden source of truth for a particular timeseries data ref. It must be able to support not only series of primitive types like doubles but also more complex user specified types (e.g. to represent the universe of listed SPX options on a given day). Each Reference Data must be tracked/audited allowing us to easily see how the time series has evolved over time. We must always be able to see how Reference Data has evolved over time. Please can you create a first draft of these docs for us to iterate on?

