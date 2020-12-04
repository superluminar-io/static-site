import * as Codepipeline from "@aws-cdk/aws-codepipeline";
import * as CodepipelineActions from "@aws-cdk/aws-codepipeline-actions";
import {
  // CfnOutput,
  Construct,
  SecretValue,
  Stack,
  StackProps,
} from "@aws-cdk/core";
import { CdkPipeline, SimpleSynthAction } from "@aws-cdk/pipelines";
import * as CodeBuild from "@aws-cdk/aws-codebuild";
import { Bucket } from "@aws-cdk/aws-s3";
import { WebsiteStage } from "../stages/website";

/**
 * The stack that defines the application pipeline
 */
export class PipelineStack extends Stack {
  readonly domainName = "static-site.alst.superluminar.io";
  readonly hostedZoneName = "alst.superluminar.io";
  readonly hostedZoneId = "Z06582792RO4T9WZ06BUN";

  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const sourceArtifact = new Codepipeline.Artifact();
    const buildArtifact = new Codepipeline.Artifact();
    const cloudAssemblyArtifact = new Codepipeline.Artifact();

    const pipeline = this.buildCDKPipeline(
      cloudAssemblyArtifact,
      sourceArtifact
    );

    const websiteInfrastructureStage = new WebsiteStage(
      this,
      "WebsiteInfrastructureStage",
      {
        domainName: this.domainName,
        hostedZoneName: this.hostedZoneName,
        hostedZoneId: this.hostedZoneId,
        ...props,
      }
    );

    pipeline.addApplicationStage(websiteInfrastructureStage);

    const websiteBuildAndDeployStage = pipeline.addStage(
      "WebsiteBuildAndDeployStage"
    );

    websiteBuildAndDeployStage.addActions(
      this.buildAction(
        sourceArtifact,
        buildArtifact,
        websiteBuildAndDeployStage.nextSequentialRunOrder()
      ),
      this.deployAction(
        buildArtifact,
        this.domainName,
        websiteBuildAndDeployStage.nextSequentialRunOrder()
      )
    );
  }

  private buildCDKPipeline(
    cloudAssemblyArtifact: Codepipeline.Artifact,
    sourceArtifact: Codepipeline.Artifact
  ) {
    return new CdkPipeline(this, "Pipeline", {
      // The pipeline name
      pipelineName: "StaticWebsitePipeline",
      cloudAssemblyArtifact,

      // Where the source can be found
      sourceAction: new CodepipelineActions.GitHubSourceAction({
        actionName: "GitHub",
        output: sourceArtifact,
        oauthToken: SecretValue.secretsManager("github-token"),
        owner: "superluminar-io",
        repo: "static-site",
        branch: "main",
      }),

      synthAction: SimpleSynthAction.standardYarnSynth({
        sourceArtifact,
        cloudAssemblyArtifact,
        subdirectory: "infrastructure",
      }),
    });
  }

  private buildAction(
    sourceArtifact: Codepipeline.Artifact,
    buildArtifact: Codepipeline.Artifact,
    runOrder: number
  ): CodepipelineActions.CodeBuildAction {
    return new CodepipelineActions.CodeBuildAction({
      input: sourceArtifact,
      outputs: [buildArtifact],
      runOrder: runOrder,
      actionName: "Build",
      project: new CodeBuild.PipelineProject(this, "StaticSiteBuildProject", {
        projectName: "StaticSiteBuildProject",
        buildSpec: CodeBuild.BuildSpec.fromSourceFilename(
          "frontend/buildspec.yml"
        ),
        environment: {
          buildImage: CodeBuild.LinuxBuildImage.STANDARD_4_0,
        },
      }),
    });
  }

  private deployAction(
    input: Codepipeline.Artifact,
    bucketName: string,
    runOrder: number
  ): CodepipelineActions.S3DeployAction {
    const bucket = Bucket.fromBucketName(this, "WebsiteBucket", bucketName);

    return new CodepipelineActions.S3DeployAction({
      actionName: "Deploy",
      runOrder: runOrder,
      input: input,
      bucket: bucket,
    });
  }
}
