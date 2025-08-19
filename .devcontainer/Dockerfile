FROM amazoncorretto:24-jdk

# Install system dependencies
RUN yum update -y && \
    yum install -y \
        git \
        wget \
        unzip \
        tar \
        gzip \
        which \
        sudo \
        jq \
        vim \
        nano \
        htop \
        tree \
        findutils \
        grep \
        sed \
        gawk \
        util-linux \
        procps-ng \
        net-tools \
        lsof \
        psmisc \
        file \
        diffutils \
        patch \
        rsync \
        openssh-clients \
        bind-utils \
        zip \
        unzip \
        tar \
    && yum clean all

# Create a non-root user
ARG USERNAME=vscode
ARG USER_UID=1000
ARG USER_GID=$USER_UID

RUN groupadd --gid $USER_GID $USERNAME \
    && useradd --uid $USER_UID --gid $USER_GID -m $USERNAME \
    && echo $USERNAME ALL=\(root\) NOPASSWD:ALL > /etc/sudoers.d/$USERNAME \
    && chmod 0440 /etc/sudoers.d/$USERNAME

# Install Maven and Gradle (using wget)
RUN wget https://archive.apache.org/dist/maven/maven-3/3.9.6/binaries/apache-maven-3.9.6-bin.tar.gz \
    && tar -xzf apache-maven-3.9.6-bin.tar.gz -C /opt \
    && ln -s /opt/apache-maven-3.9.6 /opt/maven \
    && ln -s /opt/maven/bin/mvn /usr/local/bin/mvn \
    && rm apache-maven-3.9.6-bin.tar.gz

RUN wget https://services.gradle.org/distributions/gradle-8.5-bin.zip -O gradle.zip \
    && unzip gradle.zip -d /opt \
    && ln -s /opt/gradle-8.5 /opt/gradle \
    && ln -s /opt/gradle/bin/gradle /usr/local/bin/gradle \
    && rm gradle.zip

# Install Node.js LTS (using wget)
RUN wget -qO- https://rpm.nodesource.com/setup_lts.x | bash - \
    && yum install -y nodejs

# Install AWS CLI v2 (using wget instead of curl)
RUN wget "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -O "awscliv2.zip" \
    && unzip awscliv2.zip \
    && ./aws/install \
    && rm -rf aws awscliv2.zip

# Install AWS CDK
RUN npm install -g aws-cdk

# Install AWS Amplify CLI
RUN npm install -g @aws-amplify/cli

# Install GitHub CLI
RUN wget https://github.com/cli/cli/releases/download/v2.32.1/gh_2.32.1_linux_amd64.tar.gz -O gh.tar.gz \
    && tar -xzf gh.tar.gz \
    && cp gh_2.32.1_linux_amd64/bin/gh /usr/local/bin/ \
    && rm -rf gh_2.32.1_linux_amd64 gh.tar.gz

# Install additional CLI tools for development
RUN npm install -g \
    dotenv-cli \
    typescript \
    tsx \
    nodemon \
    @types/node \
    rimraf \
    cross-env

# Set environment variables
ENV JAVA_HOME=/usr/lib/jvm/java-24-amazon-corretto
ENV MAVEN_HOME=/opt/maven
ENV GRADLE_HOME=/opt/gradle
ENV PATH=$PATH:$MAVEN_HOME/bin:$GRADLE_HOME/bin

# Switch to non-root user
USER $USERNAME

# Set working directory
WORKDIR /workspaces
