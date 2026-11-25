# syntax=docker/dockerfile:1
FROM maven:3.9-eclipse-temurin-21-alpine AS build

WORKDIR /src
RUN apk add --no-cache git

# Install the multi-client KLighD build used by Semantics.
ADD https://github.com/kieler/KLighD.git#a215953ff6323f9a837478e8c520683083bbd36d upstream/KLighD/
COPY klighd.patch ./
RUN git -C upstream/KLighD apply /src/klighd.patch && \
    mvn --batch-mode --errors --no-transfer-progress \
    -f upstream/KLighD/pom.xml \
    -pl :de.cau.cs.kieler.klighd.targetplatform,:de.cau.cs.kieler.klighd.piccolo,:de.cau.cs.kieler.klighd.lsp \
    -am \
    -DskipTests \
    -Dmaven.javadoc.skip=true \
    install

# Package the Language Server from Semantics.
ADD https://github.com/kieler/semantics.git#5f02d129c055f91ff11c53b85748c56129f3133f upstream/semantics/
COPY semantics.patch ./
RUN git -C upstream/semantics apply /src/semantics.patch && \
    mvn --batch-mode --no-transfer-progress \
    -f upstream/semantics/build/pom.xml \
    -T 1C \
    -Psemantics.ls \
    -pl :de.cau.cs.kieler.semantics.targetplatform,:de.cau.cs.kieler.annotations,:de.cau.cs.kieler.annotations.ide,:de.cau.cs.kieler.annotations.ui,:de.cau.cs.kieler.core,:de.cau.cs.kieler.kexpressions,:de.cau.cs.kieler.kexpressions.ide,:de.cau.cs.kieler.kexpressions.ui,:de.cau.cs.kieler.kicool,:de.cau.cs.kieler.kicool.ide,:de.cau.cs.kieler.kicool.ui,:de.cau.cs.kieler.simulation,:de.cau.cs.kieler.simulation.ide,:de.cau.cs.kieler.simulation.ui,:de.cau.cs.kieler.kivis,:de.cau.cs.kieler.kivis.ide,:de.cau.cs.kieler.lustre,:de.cau.cs.kieler.lustre.ide,:de.cau.cs.kieler.scg,:de.cau.cs.kieler.scl,:de.cau.cs.kieler.scl.ide,:de.cau.cs.kieler.scl.ui,:de.cau.cs.kieler.esterel,:de.cau.cs.kieler.esterel.ide,:de.cau.cs.kieler.sccharts,:de.cau.cs.kieler.sccharts.ide,:de.cau.cs.kieler.sccharts.ui,:de.cau.cs.kieler.scg.klighd,:de.cau.cs.kieler.verification,:de.cau.cs.kieler.language.server.cli \
    -am \
    -DskipTests \
    -Dmaven.javadoc.skip=true \
    package

FROM eclipse-temurin:21-jre-alpine-3.22
WORKDIR /app

# Copy over the finished Language Server jar
COPY --from=build \
    /src/upstream/semantics/build/de.cau.cs.kieler.language.server.cli/target/kieler-language-server.jar \
    /app/kieler-language-server.jar

EXPOSE 5007

CMD ["java", "-Dhost=0.0.0.0", "-Dport=5007", "-Djava.awt.headless=true", "-jar", "/app/kieler-language-server.jar"]
