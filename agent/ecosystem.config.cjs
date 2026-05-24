module.exports = {
  apps: [
    {
      name: 'tella-agent',
      script: 'src/index.ts',
      interpreter: 'tsx',
      cwd: __dirname,
      env_file: '.env.local',
      restart_delay: 5000,
      max_restarts: 10,
      log_date_format: 'YYYY-MM-DD HH:mm:ss UTC',
      out_file: './logs/agent.log',
      error_file: './logs/agent-error.log',
      merge_logs: true,
    },
  ],
}
