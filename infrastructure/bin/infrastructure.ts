#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "@aws-cdk/core";
import { PipelineStack } from "../lib/stacks/pipeline";

const app = new cdk.App();
new PipelineStack(app, "InfrastructureStack");
